package com.bulog.domain.exhibit.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("!local")
@RequiredArgsConstructor
@ConditionalOnProperty(
        prefix = "external.emuseum",
        name = "sync-enabled",
        havingValue = "true"
)
public class ExhibitSyncRunner implements ApplicationRunner {

    private final ExhibitSyncService exhibitSyncService;

    @Override
    public void run(@NonNull ApplicationArguments args) {
        ExhibitSyncResult result = exhibitSyncService.syncAll();
        log.info(
                "e뮤지엄 소장품 동기화 완료: 전체={}, 처리={}, 신규={}, 갱신={}",
                result.totalCount(),
                result.processedCount(),
                result.createdCount(),
                result.updatedCount()
        );
    }
}
