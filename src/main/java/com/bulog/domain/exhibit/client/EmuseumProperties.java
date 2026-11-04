package com.bulog.domain.exhibit.client;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "external.emuseum")
public record EmuseumProperties(
        String baseUrl,
        String serviceKey,
        String institutionCode,
        int syncPageSize
) {

    public EmuseumProperties {
        baseUrl = normalize(baseUrl);
        serviceKey = normalize(serviceKey);
        institutionCode = normalize(institutionCode);
        if (syncPageSize <= 0 || syncPageSize > 1000) {
            syncPageSize = 1000;
        }
    }

    public boolean hasServiceKey() {
        return serviceKey != null;
    }

    private static String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
