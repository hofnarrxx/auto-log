package com.hofnarrxx.autolog.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.hofnarrxx.autolog.config.AppProperties;
import com.hofnarrxx.autolog.model.AppLanguage;

import jakarta.mail.internet.MimeMessage;

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
    public void sendResetEmail(String to, String rawToken, AppLanguage language) {
        try {
            String link = appProperties.frontendUrl() + "/reset-password?token=" + rawToken;

            String subject = switch (language) {
                case PL -> "Resetowanie hasła w AutoLog";
                case UK -> "Скидання пароля в AutoLog";
                case EN -> "Reset your AutoLog password";
            };

            String body = switch (language) {
                case PL -> "Aby zresetować hasło, otwórz ten link (ważny 30 minut):\n\n" + link
                        + "\n\nJeśli nie prosiłeś o reset, zignoruj tę wiadomość.";
                case UK -> "Щоб скинути пароль, відкрийте це посилання (дійсне 30 хвилин):\n\n" + link
                        + "\n\nЯкщо ви не надсилали цей запит, проігноруйте цей лист.";
                case EN -> "To reset your password, open this link (valid for 30 minutes):\n\n" + link
                        + "\n\nIf you didn't request this, you can ignore this email.";
            };

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
