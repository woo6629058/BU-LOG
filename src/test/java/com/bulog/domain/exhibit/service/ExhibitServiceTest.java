package com.bulog.domain.exhibit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bulog.domain.exhibit.dto.res.ExhibitResponseDTO;
import com.bulog.domain.exhibit.entity.Exhibit;
import com.bulog.domain.exhibit.exception.ExhibitException;
import com.bulog.domain.exhibit.repository.ExhibitRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class ExhibitServiceTest {

    private final Exhibit exhibit = Exhibit.create(
            "sample-exhibit",
            "PS0100346400001",
            "샘플 전시물",
            "근현대",
            "샘플 설명",
            "https://example.com/exhibit.jpg",
            "부천시립박물관",
            "e뮤지엄",
            "https://www.emuseum.go.kr/detail?sample"
    );

    @Test
    void 전시물_상세를_조회한다() {
        ExhibitService exhibitService = new ExhibitService(id -> Optional.of(exhibit));

        ExhibitResponseDTO response = exhibitService.getExhibit("sample-exhibit");

        assertThat(response.id()).isEqualTo("sample-exhibit");
        assertThat(response.name()).isEqualTo("샘플 전시물");
        assertThat(response.museumName()).isEqualTo("부천시립박물관");
        assertThat(response.sourceName()).isEqualTo("e뮤지엄");
    }

    @Test
    void 존재하지_않는_전시물이면_예외가_발생한다() {
        ExhibitRepository emptyRepository = id -> Optional.empty();
        ExhibitService exhibitService = new ExhibitService(emptyRepository);

        assertThatThrownBy(() -> exhibitService.getExhibit("missing"))
                .isInstanceOf(ExhibitException.class)
                .hasMessage("전시물을 찾을 수 없습니다.");
    }
}
