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
public class EmailVerificationMailer {
    private static final Logger log = LoggerFactory.getLogger(EmailVerificationMailer.class);
    private final JavaMailSender mailSender;
    private final AppProperties appProperties;

    public EmailVerificationMailer(JavaMailSender mailSender, AppProperties appProperties) {
        this.mailSender = mailSender;
        this.appProperties = appProperties;
    }

    @Async
    public void sendVerifyEmail(String to, String rawToken, AppLanguage language) {
        try {
            String link = appProperties.frontendUrl() + "/verify-email?token=" + rawToken;

            String subject = switch (language) {
                case PL -> "Potwierdź adres e-mail w AutoLog";
                case UK -> "Підтвердіть електронну пошту в AutoLog";
                case EN -> "Confirm your AutoLog email";
            };

            String body = switch (language) {
                case PL -> "Aby dokończyć rejestrację, otwórz ten link (ważny 24 godziny):\n\n" + link
                            + "\n\nJeśli nie zakładałeś konta, zignoruj tę wiadomość.";
                case UK -> "Щоб завершити реєстрацію, відкрийте це посилання (дійсне 24 години):\n\n" + link
                            + "\n\nЯкщо ви не створювали акаунт, проігноруйте цей лист.";
                case EN -> "To finish creating your account, open this link (valid for 24 hours):\n\n" + link
                            + "\n\nIf you didn't create an account, you can ignore this email.";
            };

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(appProperties.mail().from());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);

            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send email verification to {}", to, e);
        }
    }
}
