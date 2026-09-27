package com.hofnarrxx.autolog.repository;

import com.hofnarrxx.autolog.model.MaintenanceAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface MaintenanceAttachmentRepository extends JpaRepository<MaintenanceAttachment, UUID> {
    Optional<MaintenanceAttachment> findByIdAndMaintenanceId(UUID id, UUID maintenanceId);

    Optional<MaintenanceAttachment> findByIdAndMaintenanceIdAndDeletedAtIsNull(UUID id, UUID maintenanceId);

    @Query("""
            select distinct a.maintenance.id
            from MaintenanceAttachment a
            where a.maintenance.id in :ids
              and a.deletedAt is null
            """)
    Set<UUID> findMaintenanceIdsWithAttachments(@Param("ids") Collection<UUID> ids);
}
