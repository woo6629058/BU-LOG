package com.bulog.global.security;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices;

/**
 * 로그인 상태 유지: 로그인하면 2주짜리 서명된 쿠키를 주고, 세션이 끝나도 이 쿠키로 자동 로그인한다.
 * 쿠키는 서버 메모리가 아니라 서명으로 확인하므로 재배포해도 유지된다 (서명 키 REMEMBER_ME_KEY가 같을 때).
 */
@Slf4j
@Configuration
public class RememberMeConfig {

    public static final String COOKIE_NAME = "bulog_remember";
    private static final Duration VALIDITY = Duration.ofDays(14);

    @Bean
    public TokenBasedRememberMeServices rememberMeServices(
            UserDetailsService userDetailsService,
            @Value("${app.security.remember-me-key:}") String configuredKey,
            @Value("${app.cookie.secure:false}") boolean secureCookie
    ) {
        TokenBasedRememberMeServices services = new TokenBasedRememberMeServices(
                resolveKey(configuredKey),
                userDetailsService
        );
        services.setCookieName(COOKIE_NAME);
        services.setTokenValiditySeconds((int) VALIDITY.toSeconds());
        // 체크박스 없이 로그인하면 항상 유지한다.
        services.setAlwaysRemember(true);
        services.setUseSecureCookie(secureCookie);
        return services;
    }

    // 키가 없으면 무작위 키를 만든다: 안전하지만 서버를 다시 켜면 유지 쿠키가 모두 무효가 된다.
    private static String resolveKey(String configuredKey) {
        if (configuredKey != null && !configuredKey.isBlank()) {
            return configuredKey.trim();
        }
        log.warn("REMEMBER_ME_KEY가 없어 임시 키를 씁니다. 서버를 다시 켜면 로그인 상태 유지가 풀립니다.");
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getEncoder().encodeToString(bytes);
    }
}
