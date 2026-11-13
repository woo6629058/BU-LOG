package com.bulog.domain.exhibit.curation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bulog.domain.exhibit.entity.Exhibit;
import com.bulog.domain.exhibit.repository.ExhibitReader;
import com.bulog.domain.exhibit.repository.ExhibitRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class CuratedExhibitServiceTest {

    private static final String EMUSEUM_ID = "PS0100346400300036300000";

    private final ExhibitRepository exhibitRepository = mock(ExhibitRepository.class);
    private final ExhibitReader exhibitReader = exhibitRepository;
    private final CuratedExhibitService service = new CuratedExhibitService(exhibitRepository);

    @Test
    void 없는_유물은_새로_만든다() {
        when(exhibitReader.findById(anyString())).thenReturn(Optional.empty());
        when(exhibitRepository.save(any(Exhibit.class))).thenAnswer(call -> call.getArgument(0));

        CuratedExhibitResult result = service.apply(List.of(curated("ongi2-janggun", "/images/exhibits/ongi2-janggun.jpg")));

        assertThat(result).isEqualTo(new CuratedExhibitResult(1, 1, 0));
        ArgumentCaptor<Exhibit> saved = ArgumentCaptor.forClass(Exhibit.class);
        verify(exhibitRepository).save(saved.capture());
        assertThat(saved.getValue().getId()).isEqualTo("ongi2-janggun");
        assertThat(saved.getValue().getExternalId()).isNull();
        assertThat(saved.getValue().getCardNumber()).isEqualTo(8);
    }

    @Test
    void 동기화된_e뮤지엄_소장품은_이미지를_유지한_채_수집_대상으로_바꾼다() {
        Exhibit synced = Exhibit.importFromEmuseum(EMUSEUM_ID, "관통추상석", "부천시립박물관", "https://example.com/image.jpg");
        when(exhibitReader.findById(EMUSEUM_ID)).thenReturn(Optional.of(synced));

        CuratedExhibitResult result = service.apply(List.of(curated(EMUSEUM_ID, null)));

        assertThat(result).isEqualTo(new CuratedExhibitResult(1, 0, 1));
        assertThat(synced.getName()).isEqualTo("테스트 유물");
        assertThat(synced.getDescription()).isEqualTo("테스트 설명");
        assertThat(synced.getImageUrl()).isEqualTo("/api/exhibits/" + EMUSEUM_ID + "/image");
        assertThat(synced.getExhibitionRoom()).isEqualTo("수석전시실");
        assertThat(synced.isCollectible()).isTrue();
    }

    @Test
    void 우리_사진이_있으면_e뮤지엄_사진_대신_쓴다() {
        Exhibit synced = Exhibit.importFromEmuseum(EMUSEUM_ID, "고등국어 현대문감", "부천시립박물관", "https://example.com/image.jpg");
        when(exhibitReader.findById(EMUSEUM_ID)).thenReturn(Optional.of(synced));

        service.apply(List.of(curated(EMUSEUM_ID, "/images/exhibits/edu-high-korean.jpg")));

        assertThat(synced.getImageUrl()).isEqualTo("/images/exhibits/edu-high-korean.jpg");
    }

    private CuratedExhibit curated(String id, String imageUrl) {
        return new CuratedExhibit(
                id,
                "테스트 유물",
                "조선",
                "테스트 설명",
                imageUrl,
                "부천시립박물관",
                "e뮤지엄",
                "https://www.emuseum.go.kr/",
                "수석전시실",
                8
        );
    }
}
