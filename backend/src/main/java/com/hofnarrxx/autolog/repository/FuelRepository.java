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

@Repository
public interface FuelRepository extends JpaRepository<Fuel, Long> {

        List<Fuel> findByVehicleIdAndVehicleUserId(Long vehicleId, Long userId);

        Optional<Fuel> findByIdAndVehicleIdAndVehicleUserId(Long id, Long vehicleId, Long userId);

        List<Fuel> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);

        @Query("""
                        select f from Fuel f
                        where f.vehicle.id = :vehicleId
                          and f.vehicle.user.id = :userId
                          and (:gasStation is null
                               or lower(f.gasStation) like lower(concat('%', :gasStation, '%')))
                        """)
        Page<Fuel> findPageForOwner(@Param("vehicleId") Long vehicleId,
                        @Param("userId") Long userId,
                        @Param("gasStation") String gasStation,
                        Pageable pageable);

        @Query("""
                        select f from Fuel f
                        where f.vehicle.id = :vehicleId
                          and (:gasStation is null
                               or lower(f.gasStation) like lower(concat('%', :gasStation, '%')))
                        """)
        Page<Fuel> findPageForPublicAccess(@Param("vehicleId") Long vehicleId,
                        @Param("gasStation") String gasStation,
                        Pageable pageable);
}
