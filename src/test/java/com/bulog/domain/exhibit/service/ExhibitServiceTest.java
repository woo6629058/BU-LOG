package com.bulog.domain.exhibit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bulog.domain.exhibit.dto.res.ExhibitResponseDTO;
import com.bulog.domain.exhibit.entity.Exhibit;
import com.bulog.domain.exhibit.exception.ExhibitException;
import com.bulog.domain.exhibit.repository.ExhibitCatalog;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

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
        ExhibitService exhibitService = new ExhibitService(
                new StubExhibitCatalog(Optional.of(exhibit)),
                null
        );

        ExhibitResponseDTO response = exhibitService.getExhibit("sample-exhibit");

        assertThat(response.id()).isEqualTo("sample-exhibit");
        assertThat(response.name()).isEqualTo("샘플 전시물");
        assertThat(response.museumName()).isEqualTo("부천시립박물관");
        assertThat(response.sourceName()).isEqualTo("e뮤지엄");
    }

    @Test
    void 존재하지_않는_전시물이면_예외가_발생한다() {
        ExhibitService exhibitService = new ExhibitService(
                new StubExhibitCatalog(Optional.empty()),
                null
        );

        assertThatThrownBy(() -> exhibitService.getExhibit("missing"))
                .isInstanceOf(ExhibitException.class)
                .hasMessage("전시물을 찾을 수 없습니다.");
    }

    private static class StubExhibitCatalog implements ExhibitCatalog {

        private final Optional<Exhibit> exhibit;

        private StubExhibitCatalog(Optional<Exhibit> exhibit) {
            this.exhibit = exhibit;
        }

        @Override
        public Optional<Exhibit> findById(String exhibitId) {
            return exhibit;
        }

        private List<Exhibit> allExhibits() {
            return exhibit.stream().toList();
        }

        @Override
        public List<Exhibit> findAllCollectible() {
            return allExhibits();
        }

        @Override
        public Page<Exhibit> search(
                String keyword,
                String exhibitionRoom,
                Boolean collectible,
                Pageable pageable
        ) {
            return new PageImpl<>(allExhibits(), pageable, allExhibits().size());
        }
    }
}
