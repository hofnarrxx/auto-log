package com.hofnarrxx.autolog.repository;

import com.hofnarrxx.autolog.model.MaintenanceAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceAttachmentRepository extends JpaRepository<MaintenanceAttachment, Long> {
    List<MaintenanceAttachment> findByMaintenanceId(Long maintenanceId);

    Optional<MaintenanceAttachment> findByIdAndMaintenanceId(Long id, Long maintenanceId);
}
