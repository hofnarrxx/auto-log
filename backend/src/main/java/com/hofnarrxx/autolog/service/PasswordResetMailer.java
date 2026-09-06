package com.hofnarrxx.autolog.service;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.util.Locale;
import com.hofnarrxx.autolog.config.AppProperties;

import jakarta.mail.internet.MimeMessage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class PasswordResetMailer {
    private static final Logger log = LoggerFactory.getLogger(PasswordResetMailer.class);
    private final JavaMailSender mailSender;
    private final AppProperties appProperties;

    public PasswordResetMailer(JavaMailSender mailSender, AppProperties appProperties) {
        this.mailSender = mailSender;
        this.appProperties = appProperties;
    }

    @Async
    public void sendResetEmail(String to, String rawToken, Locale locale) {
        try {
            String link = appProperties.frontendUrl() + "/reset-password?token=" + rawToken;
            boolean polish = locale != null && "pl".equalsIgnoreCase(locale.getLanguage());

            String subject = polish
                    ? "Resetowanie hasła w AutoLog"
                    : "Reset your AutoLog password";

            String body = polish
                    ? "Aby zresetować hasło, otwórz ten link (ważny 30 minut):\n\n" + link
                            + "\n\nJeśli nie prosiłeś o reset, zignoruj tę wiadomość."
                    : "To reset your password, open this link (valid for 30 minutes):\n\n" + link
                            + "\n\nIf you didn't request this, you can ignore this email.";

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(appProperties.mail().from());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);

            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}", to, e);
        }
    }
}
