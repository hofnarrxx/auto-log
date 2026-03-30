package com.hofnarrxx.autolog.repository;

import com.hofnarrxx.autolog.model.Fuel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FuelRepository extends JpaRepository<Fuel, Long> {
    List<Fuel> findByVehicleIdAndVehicleUserId(Long vehicleId, Long userId);

    Optional<Fuel> findByIdAndVehicleIdAndVehicleUserId(Long id, Long vehicleId, Long userId);
}

