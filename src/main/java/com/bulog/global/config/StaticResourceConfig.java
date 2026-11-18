package com.bulog.global.config;

import java.time.Duration;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 정적 파일 브라우저 캐시.
 * Spring Security는 기본으로 모든 응답에 "저장하지 말 것(no-store)"을 붙여서, 화면을 옮길 때마다 JS·CSS·이미지를 새로 받았다.
 * - 이미지(전시실 그림·유물 그림·사진): 거의 바뀌지 않으므로 7일 동안 다시 받지 않는다. 바꿀 때는 파일 이름을 바꾸면 바로 반영된다.
 * - JS·CSS: 배포 때마다 바뀌므로 저장은 하되 매번 서버에 바뀌었는지 묻는다 (안 바뀌었으면 304로 본문 없이 끝남).
 */
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    private static final Duration IMAGE_CACHE = Duration.ofDays(7);

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/images/**")
                .addResourceLocations("classpath:/static/images/")
                .setCacheControl(CacheControl.maxAge(IMAGE_CACHE).cachePublic());
        registry.addResourceHandler("/js/**")
                .addResourceLocations("classpath:/static/js/")
                .setCacheControl(CacheControl.noCache());
        registry.addResourceHandler("/css/**")
                .addResourceLocations("classpath:/static/css/")
                .setCacheControl(CacheControl.noCache());
    }
}
