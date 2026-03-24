package com.hofnarrxx.autolog.repository;

import com.hofnarrxx.autolog.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByUserId(Long userId);

    Optional<Vehicle> findByIdAndUserId(Long id, Long userId);
}
