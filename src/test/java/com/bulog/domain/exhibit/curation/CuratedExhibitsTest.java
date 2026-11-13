package com.bulog.domain.exhibit.curation;

import static org.assertj.core.api.Assertions.assertThat;

import com.bulog.domain.exhibit.entity.Exhibit;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;

class CuratedExhibitsTest {

    private final List<CuratedExhibit> exhibits = CuratedExhibits.ALL;

    @Test
    void 수집_대상_유물은_24개이고_ID가_겹치지_않는다() {
        assertThat(exhibits).hasSize(24);
        assertThat(exhibits.stream().map(CuratedExhibit::id).distinct()).hasSize(24);
    }

    @Test
    void 카드_번호는_1부터_24까지_차례대로다() {
        assertThat(exhibits.stream().map(CuratedExhibit::order))
                .containsExactlyElementsOf(IntStream.rangeClosed(1, 24).boxed().toList());
    }

    @Test
    void 전시실마다_유물이_4개씩_있다() {
        Map<String, Long> countByRoom = exhibits.stream()
                .collect(Collectors.groupingBy(CuratedExhibit::exhibitionRoom, Collectors.counting()));

        assertThat(countByRoom).containsOnly(
                Map.entry("옹기1전시실", 4L),
                Map.entry("옹기2전시실", 4L),
                Map.entry("부천향토역사관", 4L),
                Map.entry("유럽자기전시실", 4L),
                Map.entry("교육전시실", 4L),
                Map.entry("수석전시실", 4L)
        );
    }

    @Test
    void 이미지_경로가_있으면_실제_파일이_있다() {
        exhibits.stream()
                .map(CuratedExhibit::imageUrl)
                .filter(imageUrl -> imageUrl != null)
                .forEach(imageUrl -> assertThat(Files.isRegularFile(Path.of("src/main/resources/static" + imageUrl)))
                        .as(imageUrl)
                        .isTrue());
    }

    @Test
    void 새로_만든_전시물은_전시실과_카드_번호가_붙은_수집_대상이다() {
        CuratedExhibit first = exhibits.getFirst();

        Exhibit exhibit = first.toNewExhibit();

        assertThat(exhibit.getId()).isEqualTo("ongi1-faith-jar");
        assertThat(exhibit.getName()).isEqualTo("신앙항아리");
        assertThat(exhibit.getExhibitionRoom()).isEqualTo("옹기1전시실");
        assertThat(exhibit.getCardNumber()).isEqualTo(1);
        assertThat(exhibit.getVisitOrder()).isEqualTo(1);
        assertThat(exhibit.getImageUrl()).isEqualTo("/images/exhibits/ongi1-faith-jar.jpg");
        assertThat(exhibit.isCollectible()).isTrue();
    }
}
