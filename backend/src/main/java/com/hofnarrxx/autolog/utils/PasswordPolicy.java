package com.hofnarrxx.autolog.utils;

import org.springframework.stereotype.Component;
import java.util.regex.Pattern;

import com.hofnarrxx.autolog.exception.WeakPasswordException;

@Component
public class PasswordPolicy {
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[^A-Za-z0-9]");
    
    public void validate(String password) {
        if (password == null
                || password.length() < MIN_PASSWORD_LENGTH
                || !UPPERCASE_PATTERN.matcher(password).find()
                || !SPECIAL_CHAR_PATTERN.matcher(password).find()) {
            throw new WeakPasswordException();
        }
    }
}
