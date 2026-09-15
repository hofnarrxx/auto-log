package com.hofnarrxx.autolog.demo;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.hofnarrxx.autolog.config.DemoProperties;
import com.hofnarrxx.autolog.repository.UserRepository;
import com.hofnarrxx.autolog.utils.SecureTokenGenerator;

import com.hofnarrxx.autolog.model.User;
import com.hofnarrxx.autolog.model.AuthProvider;
import com.hofnarrxx.autolog.model.AuthProviderType;
import com.hofnarrxx.autolog.repository.AuthProviderRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

@Component
@ConditionalOnProperty(name = "demo.enabled", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {
    DemoProperties demoProperties;
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    SecureTokenGenerator secureTokenGenerator;
    AuthProviderRepository providerRepository;

    public DemoDataSeeder(DemoProperties demoProperties, UserRepository userRepository, PasswordEncoder passwordEncoder, SecureTokenGenerator secureTokenGenerator, AuthProviderRepository providerRepository) {
        this.demoProperties = demoProperties;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.secureTokenGenerator = secureTokenGenerator;
        this.providerRepository = providerRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(demoProperties.email()))
            return;
        seed();        
    }

    private void seed(){
        User demo = new User();
        demo.setEmail(demoProperties.email());
        demo.setPassword(passwordEncoder.encode(secureTokenGenerator.generateToken()));
        demo.setDemo(true);

        userRepository.save(demo);

        AuthProvider provider = new AuthProvider();
        provider.setProviderType(AuthProviderType.LOCAL);
        provider.setUser(demo);
        providerRepository.save(provider);
    }
}
