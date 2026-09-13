package com.hofnarrxx.autolog.repository;

import com.hofnarrxx.autolog.model.MaintenanceAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaintenanceAttachmentRepository extends JpaRepository<MaintenanceAttachment, UUID> {
    List<MaintenanceAttachment> findByMaintenanceId(UUID maintenanceId);

    Optional<MaintenanceAttachment> findByIdAndMaintenanceId(UUID id, UUID maintenanceId);
}
