package com.hofnarrxx.autolog.repository;

import com.hofnarrxx.autolog.model.Maintenance;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceRepository extends JpaRepository<Maintenance, Long> {
    List<Maintenance> findByVehicleIdAndVehicleUserId(Long vehicleId, Long userId);

    @EntityGraph(attributePaths = "attachments")
    List<Maintenance> findWithAttachmentsByVehicleIdAndVehicleUserId(Long vehicleId, Long userId);

    Optional<Maintenance> findByIdAndVehicleIdAndVehicleUserId(Long id, Long vehicleId, Long userId);

    @EntityGraph(attributePaths = "attachments")
    Optional<Maintenance> findWithAttachmentsByIdAndVehicleIdAndVehicleUserId(Long id, Long vehicleId, Long userId);

    List<Maintenance> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);

    @EntityGraph(attributePaths = "attachments")
    List<Maintenance> findWithAttachmentsByVehicleIdOrderByCreatedAtDesc(Long vehicleId);
}
