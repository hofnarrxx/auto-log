package com.hofnarrxx.autolog.repository;

import org.springframework.stereotype.Repository;
import com.hofnarrxx.autolog.model.PasswordResetToken;
import com.hofnarrxx.autolog.model.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);
    void deleteByUser(User user);
}
