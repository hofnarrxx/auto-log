package com.hofnarrxx.autolog.demo;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.hofnarrxx.autolog.config.DemoProperties;
import com.hofnarrxx.autolog.config.R2Properties;
import com.hofnarrxx.autolog.model.AuthProvider;
import com.hofnarrxx.autolog.model.AuthProviderType;
import com.hofnarrxx.autolog.model.Currency;
import com.hofnarrxx.autolog.model.Fuel;
import com.hofnarrxx.autolog.model.FuelType;
import com.hofnarrxx.autolog.model.Maintenance;
import com.hofnarrxx.autolog.model.MaintenanceAttachment;
import com.hofnarrxx.autolog.model.MaintenanceCategory;
import com.hofnarrxx.autolog.model.User;
import com.hofnarrxx.autolog.model.Vehicle;
import com.hofnarrxx.autolog.repository.AuthProviderRepository;
import com.hofnarrxx.autolog.repository.FuelRepository;
import com.hofnarrxx.autolog.repository.MaintenanceAttachmentRepository;
import com.hofnarrxx.autolog.repository.MaintenanceRepository;
import com.hofnarrxx.autolog.repository.UserRepository;
import com.hofnarrxx.autolog.repository.VehicleRepository;
import com.hofnarrxx.autolog.utils.SecureTokenGenerator;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Component
@ConditionalOnProperty(name = "demo.enabled", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {
    private static final List<String> GAS_STATIONS = List.of(
            "Shell",
            "BP",
            "TotalEnergies",
            "Orlen",
            "OMV",
            "Circle K",
            "Esso");

    private static final String VEHICLE_IMAGE_NAME = "peugeot406.jpg";
    private static final String MAINTENANCE_ATTACHMENT_NAME = "invoice-demo.pdf";

    private final DemoProperties demoProperties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureTokenGenerator secureTokenGenerator;
    private final AuthProviderRepository providerRepository;
    private final VehicleRepository vehicleRepository;
    private final FuelRepository fuelRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final MaintenanceAttachmentRepository maintenanceAttachmentRepository;
    private final R2Properties r2Properties;
    private final S3Client s3Client;

    public DemoDataSeeder(DemoProperties demoProperties, UserRepository userRepository, PasswordEncoder passwordEncoder,
            SecureTokenGenerator secureTokenGenerator, AuthProviderRepository providerRepository,
            VehicleRepository vehicleRepository, FuelRepository fuelRepository,
            MaintenanceRepository maintenanceRepository, MaintenanceAttachmentRepository maintenanceAttachmentRepository, R2Properties r2Properties, S3Client s3Client) {
        this.demoProperties = demoProperties;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.secureTokenGenerator = secureTokenGenerator;
        this.providerRepository = providerRepository;
        this.vehicleRepository = vehicleRepository;
        this.fuelRepository = fuelRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.maintenanceAttachmentRepository = maintenanceAttachmentRepository;
        this.r2Properties = r2Properties;
        this.s3Client = s3Client;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(demoProperties.email()))
            return;
        seed();
    }

    private void seed() {
        User demo = new User();
        demo.setEmail(demoProperties.email());
        demo.setPassword(passwordEncoder.encode(secureTokenGenerator.generateToken()));
        demo.setDemo(true);
        userRepository.save(demo);

        AuthProvider provider = new AuthProvider();
        provider.setProviderType(AuthProviderType.LOCAL);
        provider.setUser(demo);
        providerRepository.save(provider);

        Vehicle vehicle = generateVehicle(demo);
        vehicleRepository.save(vehicle);
        seedFuelEntries(vehicle);
        seedMaintenanceEntries(vehicle);
        attachImage(vehicle);
    }

    private Vehicle generateVehicle(User user) {
        Vehicle vehicle = new Vehicle();
        vehicle.setBrand("Peugeot");
        vehicle.setModel("406");
        vehicle.setYear(1997);
        vehicle.setFuelType(FuelType.PETROL);
        vehicle.setMileage(248500);
        vehicle.setUser(user);
        return vehicle;
    } 

    private void attachImage(Vehicle vehicle) {
        try {
            ClassPathResource resource = new ClassPathResource(String.format("demo/%s", VEHICLE_IMAGE_NAME));
            byte[] bytes = resource.getInputStream().readAllBytes();
            String objectKey = String.format("vehicles/%s/%s-%s",
                    vehicle.getId(), UUID.randomUUID(), VEHICLE_IMAGE_NAME);
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(r2Properties.bucket())
                            .key(objectKey)
                            .contentType("image/jpeg")
                            .build(),
                    RequestBody.fromBytes(bytes));
            vehicle.setImage(objectKey);
            vehicleRepository.save(vehicle);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to seed demo vehicle image", e);
        }
    }

    private void attachInvoice(Maintenance maintenance) {
        try {
            ClassPathResource resource =
                    new ClassPathResource("demo/" + MAINTENANCE_ATTACHMENT_NAME);
            byte[] bytes = resource.getInputStream().readAllBytes();
            UUID vehicleId = maintenance.getVehicle().getId();
            String objectKey = String.format("maintenance/%s/%s/%s-%s",
                    vehicleId,
                    maintenance.getId(),
                    UUID.randomUUID(),
                    MAINTENANCE_ATTACHMENT_NAME);
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(r2Properties.bucket())
                            .key(objectKey)
                            .contentType("application/pdf")
                            .build(),
                    RequestBody.fromBytes(bytes));
            MaintenanceAttachment attachment = new MaintenanceAttachment();
            attachment.setMaintenance(maintenance);
            attachment.setObjectKey(objectKey);
            attachment.setFileName(MAINTENANCE_ATTACHMENT_NAME);
            attachment.setContentType("application/pdf");
            attachment.setSizeBytes((long) bytes.length);
            // leave url null — download uses objectKey via presign
            maintenanceAttachmentRepository.save(attachment);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to seed demo maintenance attachment", e);
        }
    }

    private void seedFuelEntries(Vehicle vehicle) {
        // ~11 months ending recently; ~every 2–3 weeks; monotonically increasing mileage
        LocalDate start = LocalDate.now().minusMonths(11).withDayOfMonth(8);
        int mileage = 242100;

        double[] liters = {
                42.5, 48.0, 39.2, 51.0, 45.5, 38.0, 50.2, 44.0, 47.8, 41.5,
                52.0, 40.0, 46.5, 49.0, 43.2, 37.5, 51.5, 45.0, 48.5, 42.0
        };
        double[] pricePerLiter = {
                1.62, 1.65, 1.59, 1.71, 1.68, 1.64, 1.72, 1.69, 1.66, 1.70,
                1.74, 1.67, 1.73, 1.75, 1.71, 1.68, 1.76, 1.72, 1.70, 1.74
        };
        int[] dayGaps = {
                16, 18, 14, 21, 17, 15, 19, 16, 20, 14,
                18, 17, 15, 19, 16, 21, 14, 18, 17, 15
        };

        LocalDate date = start;
        for (int i = 0; i < 20; i++) {
            if (i > 0) {
                date = date.plusDays(dayGaps[i]);
            }
            mileage += 280 + (i % 5) * 40 + (i % 3) * 25;

            BigDecimal amount = BigDecimal.valueOf(liters[i]).setScale(3, RoundingMode.HALF_UP);
            BigDecimal cost = amount
                    .multiply(BigDecimal.valueOf(pricePerLiter[i]))
                    .setScale(2, RoundingMode.HALF_UP);

            Fuel fuel = new Fuel();
            fuel.setVehicle(vehicle);
            fuel.setDate(date);
            fuel.setMileage(mileage);
            fuel.setAmount(amount);
            fuel.setCost(cost);
            fuel.setCurrency(Currency.EURO);
            fuel.setGasStation(GAS_STATIONS.get(i % GAS_STATIONS.size()));
            fuelRepository.save(fuel);
        }

        vehicle.setMileage(mileage);
        vehicleRepository.save(vehicle);
    }

    private void seedMaintenanceEntries(Vehicle vehicle) {
        LocalDate start = LocalDate.now().minusMonths(11).withDayOfMonth(12);

        saveMaintenance(vehicle, MaintenanceCategory.OIL_CHANGE, "Engine oil & filter",
                "5W-40 synthetic oil and oil filter replacement.", 89.00, start.plusDays(5), 242450);
        saveMaintenance(vehicle, MaintenanceCategory.INSPECTION, "Annual safety inspection",
                "Mandatory roadworthiness check; passed without defects.", 65.00, start.plusDays(38), 243200);
        saveMaintenance(vehicle, MaintenanceCategory.TIRES_AND_WHEELS, "Summer tire change",
                "Switched to summer set, balanced all four wheels.", 48.00, start.plusDays(72), 243900);
        saveMaintenance(vehicle, MaintenanceCategory.FLUID_REFILL, "Coolant top-up",
                "Refilled coolant to level after minor loss.", 22.50, start.plusDays(110), 244600);
        Maintenance brakePads = saveMaintenance(vehicle, MaintenanceCategory.PART_REPLACEMENT, "Front brake pads",
                "Replaced worn front pads; discs still within spec.", 145.00, start.plusDays(145), 245350);
        attachInvoice(brakePads);
        saveMaintenance(vehicle, MaintenanceCategory.REPAIR, "Alternator belt replacement",
                "Cracked serpentine belt replaced; tensioner checked.", 120.00, start.plusDays(180), 246000);
        saveMaintenance(vehicle, MaintenanceCategory.COSMETIC, "Touch-up paint (door)",
                "Minor scratch on passenger door repaired and polished.", 95.00, start.plusDays(215), 246550);
        saveMaintenance(vehicle, MaintenanceCategory.OIL_CHANGE, "Oil change service",
                "Routine oil and filter change at ~5,000 km interval.", 92.00, start.plusDays(250), 247200);
        saveMaintenance(vehicle, MaintenanceCategory.PART_REPLACEMENT, "Cabin pollen filter",
                "Replaced cabin air filter before allergy season.", 35.00, start.plusDays(285), 247750);
        saveMaintenance(vehicle, MaintenanceCategory.INSPECTION, "Pre-winter checkup",
                "Battery, lights, wipers, and fluid levels checked.", 55.00, start.plusDays(320), 248300);
    }

    private Maintenance saveMaintenance(Vehicle vehicle, MaintenanceCategory category, String title, String description,
            double cost, LocalDate serviceDate, int mileage) {
        Maintenance maintenance = new Maintenance();
        maintenance.setVehicle(vehicle);
        maintenance.setCategory(category.getDisplayName());
        maintenance.setTitle(title);
        maintenance.setDescription(description);
        maintenance.setCost(BigDecimal.valueOf(cost).setScale(2, RoundingMode.HALF_UP));
        maintenance.setCurrency(Currency.EURO);
        maintenance.setServiceDate(serviceDate);
        maintenance.setMileage(mileage);
        return maintenanceRepository.save(maintenance);
    }
}
