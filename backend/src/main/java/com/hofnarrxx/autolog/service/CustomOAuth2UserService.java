package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.model.AuthProvider;
import com.hofnarrxx.autolog.model.AuthProviderType;
import com.hofnarrxx.autolog.model.User;
import com.hofnarrxx.autolog.repository.AuthProviderRepository;
import com.hofnarrxx.autolog.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    private final UserRepository userRepository;
    private final AuthProviderRepository providerRepository;

    public CustomOAuth2UserService(UserRepository userRepository,
                                   AuthProviderRepository providerRepository) {
        this.userRepository = userRepository;
        this.providerRepository = providerRepository;
    }

    @Transactional
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest)
            throws OAuth2AuthenticationException {

        OAuth2User oauthUser = super.loadUser(userRequest);

        Map<String, Object> attributes = oauthUser.getAttributes();

        String email = (String) attributes.get("email");
        String googleId = oauthUser.getAttribute("sub");
        Optional<AuthProvider> providerOpt =
                providerRepository.findByProviderTypeAndProviderId(
                        AuthProviderType.GOOGLE,
                        googleId
                );
        if (providerOpt.isPresent()) {
            return oauthUser;
        }
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(email);
                    return userRepository.save(newUser);
                });
        AuthProvider provider = new AuthProvider();
        provider.setProviderType(AuthProviderType.GOOGLE);
        provider.setProviderId(googleId);
        provider.setUser(user);

        providerRepository.save(provider);

        return oauthUser;
    }
}
