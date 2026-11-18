package com.bulog.domain.quiz.curation;

import static org.assertj.core.api.Assertions.assertThat;

import com.bulog.domain.exhibit.curation.CuratedExhibit;
import com.bulog.domain.exhibit.curation.CuratedExhibits;
import com.bulog.domain.quiz.dto.res.QuizResponseDTO;
import com.bulog.domain.quiz.converter.QuizConverter;
import java.util.List;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;

class CuratedQuizzesTest {

    private static final Pattern LOCK = Pattern.compile("\\d{3,}");
    private static final Pattern SPOT = Pattern.compile("spot:\\s*[\\d.]+\\s*,\\s*[\\d.]+\\s*,\\s*[\\d.]+");

    private final List<CuratedQuiz> quizzes = CuratedQuizzes.ALL;

    @Test
    void 수집_대상_유물_24개마다_미션이_하나씩_같은_순서로_있다() {
        assertThat(quizzes.stream().map(CuratedQuiz::exhibitId))
                .containsExactlyElementsOf(CuratedExhibits.ALL.stream().map(CuratedExhibit::id).toList());
    }

    @Test
    void 미션마다_정답은_하나이고_보기는_두_개_이상이다() {
        quizzes.forEach(quiz -> {
            assertThat(quiz.options()).as(quiz.exhibitId()).hasSizeGreaterThanOrEqualTo(2);
            assertThat(quiz.options().stream().filter(CuratedQuiz.Option::correct)).as(quiz.exhibitId()).hasSize(1);
        });
    }

    @Test
    void local_보기_ID는_겹치지_않는다() {
        List<Long> ids = quizzes.stream().flatMap(quiz -> quiz.options().stream()).map(CuratedQuiz.Option::localId).toList();
        assertThat(ids).doesNotHaveDuplicates();
    }

    @Test
    void 자물쇠_미션은_자리_수만큼_다이얼_이름이_있다() {
        quizzes.stream()
                .filter(quiz -> quiz.options().stream().allMatch(option -> LOCK.matcher(option.content()).matches()))
                .forEach(quiz -> {
                    int length = quiz.options().getFirst().content().length();
                    assertThat(quiz.options()).allSatisfy(option -> assertThat(option.content()).hasSize(length));
                    assertThat(quiz.dialLabels()).as(quiz.exhibitId()).hasSize(length);
                });
    }

    @Test
    void 찾아_누르기와_순서_놓기_보기는_한_미션_안에서_형식이_같다() {
        quizzes.forEach(quiz -> {
            List<String> contents = quiz.options().stream().map(CuratedQuiz.Option::content).toList();
            if (contents.stream().anyMatch(content -> content.startsWith("spot:"))) {
                assertThat(contents).as(quiz.exhibitId()).allMatch(content -> SPOT.matcher(content).matches());
            }
            if (contents.stream().anyMatch(content -> content.startsWith("order:"))) {
                assertThat(contents).as(quiz.exhibitId()).allMatch(content -> content.startsWith("order:") && content.contains(">"));
            }
        });
    }

    @Test
    void 화면에는_힌트와_다이얼_이름을_보내고_정답은_보내지_않는다() {
        QuizResponseDTO response = QuizConverter.toResponse(quizzes.getFirst().toLocalQuiz(1L));

        assertThat(response.hint()).isNotBlank();
        assertThat(response.dialLabels()).containsExactly("십자가", "물결띠", "뚜껑 손잡이");
        assertThat(response.options()).extracting("content").containsExactly("221", "212", "121", "222");
    }
}
