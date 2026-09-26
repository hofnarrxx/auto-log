package com.hofnarrxx.autolog.demo;

import com.hofnarrxx.autolog.model.Currency;
import com.hofnarrxx.autolog.model.MaintenanceCategory;
import com.hofnarrxx.autolog.utils.RequestValidation;
import java.util.List;
import java.util.Locale;

public record DemoContent(Currency currency,
        List<String> gasStations,
        double[] pricePerUnit, List<MaintenanceSeed> maintenance) {
    public record MaintenanceSeed(MaintenanceCategory category, String title, String description, double cost) {
    }

    public static final DemoContent ENGLISH = new DemoContent(
            Currency.EURO,
            List.of("Shell", "BP", "TotalEnergies", "Orlen", "OMV", "Circle K", "Esso"),
            new double[] {
                    1.62, 1.65, 1.59, 1.71, 1.68, 1.64, 1.72, 1.69, 1.66, 1.70,
                    1.74, 1.67, 1.73, 1.75, 1.71, 1.68, 1.76, 1.72, 1.70, 1.74
            },
            List.of(
                    new MaintenanceSeed(MaintenanceCategory.OIL_AND_FILTERS, "Engine oil & filter",
                            "5W-40 synthetic oil and oil filter replacement.", 89.00),
                    new MaintenanceSeed(MaintenanceCategory.INSPECTION_AND_DIAGNOSTICS, "Annual safety inspection",
                            "Mandatory roadworthiness check; passed without defects.", 65.00),
                    new MaintenanceSeed(MaintenanceCategory.TIRES_AND_WHEELS, "Summer tire change",
                            "Switched to summer set, balanced all four wheels.", 48.00),
                    new MaintenanceSeed(MaintenanceCategory.FLUIDS, "Coolant top-up",
                            "Refilled coolant to level after minor loss.", 22.50),
                    new MaintenanceSeed(MaintenanceCategory.PART_REPLACEMENT, "Front brake pads",
                            "Replaced worn front pads; discs still within spec.", 145.00),
                    new MaintenanceSeed(MaintenanceCategory.REPAIR, "Alternator belt replacement",
                            "Cracked serpentine belt replaced; tensioner checked.", 120.00),
                    new MaintenanceSeed(MaintenanceCategory.COSMETIC, "Touch-up paint (door)",
                            "Minor scratch on passenger door repaired and polished.", 95.00),
                    new MaintenanceSeed(MaintenanceCategory.OIL_AND_FILTERS, "Oil change service",
                            "Routine oil and filter change at ~5,000 km interval.", 92.00),
                    new MaintenanceSeed(MaintenanceCategory.PART_REPLACEMENT, "Cabin pollen filter",
                            "Replaced cabin air filter before allergy season.", 35.00),
                    new MaintenanceSeed(MaintenanceCategory.INSPECTION_AND_DIAGNOSTICS, "Pre-winter checkup",
                            "Battery, lights, wipers, and fluid levels checked.", 55.00)));

    public static final DemoContent POLISH = new DemoContent(
            Currency.ZLOTY,
            List.of("Orlen", "Circle K", "BP", "Shell", "Moya", "Amic", "Lotos"),
            new double[] {
                    7.90, 7.96, 7.85, 8.06, 8.01, 7.94, 8.08, 8.03, 7.97, 8.04,
                    8.11, 7.99, 8.10, 8.13, 8.06, 8.01, 8.15, 8.08, 8.04, 8.11
            },
            List.of(
                    new MaintenanceSeed(MaintenanceCategory.OIL_AND_FILTERS, "Wymiana oleju i filtra",
                            "Olej syntetyczny 5W-40 i wymiana filtra oleju.", 375.00),
                    new MaintenanceSeed(MaintenanceCategory.INSPECTION_AND_DIAGNOSTICS, "Roczny przegląd techniczny",
                            "Obowiązkowe badanie techniczne; zaliczone bez usterek.", 149.00),
                    new MaintenanceSeed(MaintenanceCategory.TIRES_AND_WHEELS, "Wymiana opon na letnie",
                            "Założono komplet letni, wyważono wszystkie cztery koła.", 200.00),
                    new MaintenanceSeed(MaintenanceCategory.FLUIDS, "Uzupełnienie płynu chłodniczego",
                            "Uzupełniono płyn chłodniczy po niewielkim ubytku.", 95.00),
                    new MaintenanceSeed(MaintenanceCategory.PART_REPLACEMENT, "Klocki hamulcowe przód",
                            "Wymieniono zużyte klocki przednie; tarcze nadal w normie.", 450.00),
                    new MaintenanceSeed(MaintenanceCategory.REPAIR, "Wymiana paska alternatora",
                            "Pęknięty pasek wielorowkowy wymieniony; sprawdzono napinacz.", 500.00),
                    new MaintenanceSeed(MaintenanceCategory.COSMETIC, "Retusz lakieru (drzwi)",
                            "Drobna rysa na drzwiach pasażera naprawiona i wypolerowana.", 400.00),
                    new MaintenanceSeed(MaintenanceCategory.OIL_AND_FILTERS, "Serwis wymiany oleju",
                            "Rutynowa wymiana oleju i filtra co ok. 5000 km.", 385.00),
                    new MaintenanceSeed(MaintenanceCategory.PART_REPLACEMENT, "Filtr kabinowy",
                            "Wymieniono filtr kabinowy przed sezonem alergii.", 150.00),
                    new MaintenanceSeed(MaintenanceCategory.INSPECTION_AND_DIAGNOSTICS, "Przegląd przed zimą",
                            "Sprawdzono akumulator, światła, wycieraczki i poziomy płynów.", 230.00)));

    public static final DemoContent UKRAINIAN = new DemoContent(
            Currency.HRYVNIA,
            List.of("OKKO", "WOG", "Shell", "SOCAR", "UPG", "KLO", "Ukrnafta"),
            new double[] {
                    87.41, 88.82, 86.00, 91.65, 90.24, 88.35, 92.12, 90.71, 89.29, 91.18,
                    93.06, 89.76, 92.59, 93.53, 91.65, 90.24, 94.00, 92.12, 91.18, 93.06
            },
            List.of(
                    new MaintenanceSeed(MaintenanceCategory.OIL_AND_FILTERS, "Заміна оливи та фільтра",
                            "Синтетична олива 5W-40 і заміна масляного фільтра.", 3200.00),
                    new MaintenanceSeed(MaintenanceCategory.INSPECTION_AND_DIAGNOSTICS, "Комплексна діагностика",
                            "Перевірка ходової, гальм і рівнів рідин; зауважень немає.", 1200.00),
                    new MaintenanceSeed(MaintenanceCategory.TIRES_AND_WHEELS, "Перевзуття на літню гуму",
                            "Встановлено літній комплект, збалансовано всі чотири колеса.", 1200.00),
                    new MaintenanceSeed(MaintenanceCategory.FLUIDS, "Долив охолоджувальної рідини",
                            "Долито антифриз після незначної втрати.", 650.00),
                    new MaintenanceSeed(MaintenanceCategory.PART_REPLACEMENT, "Передні гальмівні колодки",
                            "Замінено зношені передні колодки; диски ще в нормі.", 2400.00),
                    new MaintenanceSeed(MaintenanceCategory.REPAIR, "Заміна ременя генератора",
                            "Тріснутий поліклиновий ремінь замінено; перевірено натягувач.", 3200.00),
                    new MaintenanceSeed(MaintenanceCategory.COSMETIC, "Підфарбування дверей",
                            "Невелику подряпину на пасажирських дверях усунуто та відполіровано.", 2800.00),
                    new MaintenanceSeed(MaintenanceCategory.OIL_AND_FILTERS, "Планова заміна оливи",
                            "Чергова заміна оливи та фільтра приблизно через 5000 км.", 3300.00),
                    new MaintenanceSeed(MaintenanceCategory.PART_REPLACEMENT, "Салонний фільтр",
                            "Замінено салонний фільтр перед сезоном алергії.", 900.00),
                    new MaintenanceSeed(MaintenanceCategory.INSPECTION_AND_DIAGNOSTICS, "Перевірка перед зимою",
                            "Перевірено акумулятор, світло, двірники та рівні рідин.", 1500.00)));

    public static DemoContent forLanguage(String language) {
        language = RequestValidation.normalizeToNull(language);
        if (language == null)
            return ENGLISH;

        return switch (language.toLowerCase(Locale.ROOT)) {
            case "pl" -> POLISH;
            case "ua" -> UKRAINIAN;
            default -> ENGLISH;
        };
    }
}
