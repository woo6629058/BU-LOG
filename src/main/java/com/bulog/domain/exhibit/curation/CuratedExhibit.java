package com.bulog.domain.exhibit.curation;

import com.bulog.domain.exhibit.entity.Exhibit;

/**
 * 수집 대상 유물 한 개의 정보.
 *
 * @param id          전시물 ID. QR과 사진 파일 이름에도 같은 값을 쓴다.
 * @param imageUrl    우리 서버의 이미지 경로. null이면 기존 이미지를 유지한다.
 * @param order       카드 번호이자 관람 순서(1부터).
 */
public record CuratedExhibit(
        String id,
        String name,
        String era,
        String description,
        String imageUrl,
        String museumName,
        String sourceName,
        String sourceUrl,
        String exhibitionRoom,
        int order
) {

    public Exhibit toNewExhibit() {
        Exhibit exhibit = Exhibit.create(
                id,
                null,
                name,
                era,
                description,
                imageUrl,
                museumName,
                sourceName,
                sourceUrl
        );
        applyTo(exhibit);
        return exhibit;
    }

    public void applyTo(Exhibit exhibit) {
        exhibit.applyCuration(
                name,
                era,
                description,
                imageUrl,
                museumName,
                sourceName,
                sourceUrl,
                exhibitionRoom,
                order,
                order
        );
    }
}
