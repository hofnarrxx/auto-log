package com.hofnarrxx.autolog.repository;

import com.hofnarrxx.autolog.model.Fuel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FuelRepository extends JpaRepository<Fuel, UUID> {

        List<Fuel> findByVehicleIdAndVehicleUserId(UUID vehicleId, UUID userId);

        Optional<Fuel> findByIdAndVehicleIdAndVehicleUserId(UUID id, UUID vehicleId, UUID userId);

        List<Fuel> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

        @Query("""
                        select f from Fuel f
                        where f.vehicle.id = :vehicleId
                          and f.vehicle.user.id = :userId
                          and (:gasStation is null
                               or lower(f.gasStation) like lower(concat('%', cast(:gasStation as string), '%')))
                        """)
        Page<Fuel> findPageForOwner(@Param("vehicleId") UUID vehicleId,
                        @Param("userId") UUID userId,
                        @Param("gasStation") String gasStation,
                        Pageable pageable);

        @Query("""
                        select f from Fuel f
                        where f.vehicle.id = :vehicleId
                          and (:gasStation is null
                               or lower(f.gasStation) like lower(concat('%', cast(:gasStation as string), '%')))
                        """)
        Page<Fuel> findPageForPublicAccess(@Param("vehicleId") UUID vehicleId,
                        @Param("gasStation") String gasStation,
                        Pageable pageable);
}
