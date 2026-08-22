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

@Repository
public interface MaintenanceRepository extends JpaRepository<Maintenance, Long> {
    List<Maintenance> findByVehicleIdAndVehicleUserId(Long vehicleId, Long userId);

    Optional<Maintenance> findByIdAndVehicleIdAndVehicleUserId(Long id, Long vehicleId, Long userId);

    Optional<Maintenance> findByIdAndVehicleId(Long id, Long vehicleId);

    @EntityGraph(attributePaths = "attachments")
    Optional<Maintenance> findWithAttachmentsByIdAndVehicleIdAndVehicleUserId(Long id, Long vehicleId, Long userId);

    List<Maintenance> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);

    @Query("""
            select m from Maintenance m
            where m.vehicle.id = :vehicleId
                and m.vehicle.user.id = :userId
                and (:hasCategories = false or m.category in :categories)
                and (:currency is null or m.currency = :currency)
                and (:minCost is null or m.cost >= :minCost)
                and (:maxCost is null or m.cost <= :maxCost)
                and (:title is null or lower(m.title) like lower(concat('%', :title, '%')))
            """)
    Page<Maintenance> findPageForOwner(@Param("vehicleId") Long vehicleId,
            @Param("userId") Long userId,
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
                and (:title is null or lower(m.title) like lower(concat('%', :title, '%')))
            """)
    Page<Maintenance> findPageForPublicAccess(@Param("vehicleId") Long vehicleId,
            @Param("hasCategories") Boolean hasCategories,
            @Param("categories") List<String> categories,
            @Param("currency") Currency currency,
            @Param("minCost") BigDecimal minCost,
            @Param("maxCost") BigDecimal maxCost,
            @Param("title") String title,
            Pageable pageable);
}
