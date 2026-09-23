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
            String language = locale != null ? locale.getLanguage() : "en";
            String subject;
            String body;
            switch (language.toLowerCase()) {
                case "pl" -> {
                    subject = "Resetowanie hasła w AutoLog";
                    body = "Aby zresetować hasło, otwórz ten link (ważny 30 minut):\n\n" + link
                            + "\n\nJeśli nie prosiłeś o reset, zignoruj tę wiadomość.";
                }
                case "ua" -> {
                    subject = "Скидання пароля в AutoLog";
                    body = "Щоб скинути пароль, відкрийте це посилання (дійсне 30 хвилин):\n\n" + link
                            + "\n\nЯкщо ви не надсилали цей запит, проігноруйте цей лист.";
                }
                default -> {
                    subject = "Reset your AutoLog password";
                    body = "To reset your password, open this link (valid for 30 minutes):\n\n" + link
                            + "\n\nIf you didn't request this, you can ignore this email.";
                }
            }

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
