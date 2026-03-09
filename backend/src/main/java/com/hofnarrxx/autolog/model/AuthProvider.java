package com.hofnarrxx.autolog.model;

import jakarta.persistence.*;

@Entity
@Table(name = "auth_providers")
public class AuthProvider {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private AuthProviderType providerType;

    private String providerId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    public AuthProviderType getProviderType() {
        return providerType;
    }

    public void setProviderType(AuthProviderType providerType) {
        this.providerType = providerType;
    }

    public String getProviderId() {
        return providerId;
    }

    public void setProviderId(String providerId) {
        this.providerId = providerId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
