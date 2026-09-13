package com.hofnarrxx.autolog.repository;

import com.hofnarrxx.autolog.model.Currency;
import com.hofnarrxx.autolog.model.Maintenance;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaintenanceRepository extends JpaRepository<Maintenance, UUID> {
    List<Maintenance> findByVehicleIdAndVehicleUserId(UUID vehicleId, UUID userId);

    Optional<Maintenance> findByIdAndVehicleIdAndVehicleUserId(UUID id, UUID vehicleId, UUID userId);

    Optional<Maintenance> findByIdAndVehicleId(UUID id, UUID vehicleId);

    @EntityGraph(attributePaths = "attachments")
    Optional<Maintenance> findWithAttachmentsByIdAndVehicleIdAndVehicleUserId(UUID id, UUID vehicleId, UUID userId);

    @EntityGraph(attributePaths = "attachments")
    Optional<Maintenance> findWithAttachmentsByIdAndVehicleId(UUID id, UUID vehicleId);
    
    List<Maintenance> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

    @Query("""
            select m from Maintenance m
            where m.vehicle.id = :vehicleId
                and m.vehicle.user.id = :userId
                and (:hasCategories = false or m.category in :categories)
                and (:currency is null or m.currency = :currency)
                and (:minCost is null or m.cost >= :minCost)
                and (:maxCost is null or m.cost <= :maxCost)
                and (:title is null or lower(m.title) like lower(concat('%', cast(:title as string), '%')))
            """)
    Page<Maintenance> findPageForOwner(@Param("vehicleId") UUID vehicleId,
            @Param("userId") UUID userId,
            @Param("hasCategories") Boolean hasCategories,
            @Param("categories") List<String> categories,
            @Param("currency") Currency currency,
            @Param("minCost") BigDecimal minCost,
            @Param("maxCost") BigDecimal maxCost,
            @Param("title") String title,
            Pageable pageable);

    @Query("""
            select m from Maintenance m
            where m.vehicle.id = :vehicleId
                and (:hasCategories = false or m.category in :categories)
                and (:currency is null or m.currency = :currency)
                and (:minCost is null or m.cost >= :minCost)
                and (:maxCost is null or m.cost <= :maxCost)
                and (:title is null or lower(m.title) like lower(concat('%', cast(:title as string), '%')))
            """)
    Page<Maintenance> findPageForPublicAccess(@Param("vehicleId") UUID vehicleId,
            @Param("hasCategories") Boolean hasCategories,
            @Param("categories") List<String> categories,
            @Param("currency") Currency currency,
            @Param("minCost") BigDecimal minCost,
            @Param("maxCost") BigDecimal maxCost,
            @Param("title") String title,
            Pageable pageable);
}
