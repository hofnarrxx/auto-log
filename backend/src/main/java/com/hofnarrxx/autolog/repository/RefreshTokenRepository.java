package com.hofnarrxx.autolog.repository;

import com.hofnarrxx.autolog.model.RefreshToken;
import com.hofnarrxx.autolog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.time.Instant;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenAndRevokedFalse(String token);

    void deleteByUser(User user);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update RefreshToken t set t.revoked = true " +
            "where t.token = :token and t.revoked = false and t.expiresAt > :now")
    int revokeIfActive(@Param("token") String token, @Param("now") Instant now);

    @Query("select t.user from RefreshToken t where t.token = :token")
    Optional<User> findUserByToken(@Param("token") String token);

    @Modifying
    @Query("delete from RefreshToken t where t.user = :user and (t.revoked = true or t.expiresAt < :now)")
    void deleteInactiveByUser(@Param("user") User user, @Param("now") Instant now);
}
