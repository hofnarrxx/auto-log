package com.hofnarrxx.autolog.repository;

import com.hofnarrxx.autolog.model.MaintenanceAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaintenanceAttachmentRepository extends JpaRepository<MaintenanceAttachment, UUID> {
    Optional<MaintenanceAttachment> findByIdAndMaintenanceId(UUID id, UUID maintenanceId);

    Optional<MaintenanceAttachment> findByIdAndMaintenanceIdAndDeletedAtIsNull(UUID id, UUID maintenanceId);
}
