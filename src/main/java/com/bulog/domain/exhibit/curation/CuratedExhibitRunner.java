package com.bulog.domain.exhibit.curation;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * 서버가 켜질 때 수집 대상 유물 24개를 DB에 넣거나 갱신한다.
 * 실패해도 서버는 계속 켜지고 오류 로그만 남긴다.
 */
@Slf4j
@Component
@Profile("!local")
@RequiredArgsConstructor
public class CuratedExhibitRunner implements ApplicationRunner {

    private final CuratedExhibitService curatedExhibitService;

    @Override
    public void run(@NonNull ApplicationArguments args) {
        try {
            CuratedExhibitResult result = curatedExhibitService.applyAll();
            log.info(
                    "수집 대상 유물 등록 완료: 전체={}, 신규={}, 갱신={}",
                    result.totalCount(),
                    result.createdCount(),
                    result.updatedCount()
            );
        } catch (RuntimeException exception) {
            log.error("수집 대상 유물 등록에 실패했습니다.", exception);
        }
    }
}
