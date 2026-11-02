package com.bulog.domain.quiz.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.groups.Tuple.tuple;

import com.bulog.domain.quiz.dto.res.QuizAttemptResponseDTO;
import com.bulog.domain.quiz.dto.res.QuizResponseDTO;
import com.bulog.domain.quiz.entity.Quiz;
import com.bulog.domain.quiz.entity.QuizOption;
import com.bulog.domain.quiz.exception.QuizException;
import com.bulog.domain.quiz.repository.QuizReader;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class QuizServiceTest {

    private final Quiz quiz = Quiz.create(
            1L,
            "sample-exhibit",
            "이 전시물이 제작된 시대는 언제일까요?",
            "상감청자는 고려 시대를 대표하는 도자기입니다.",
            List.of(
                    QuizOption.create(11L, "고려", true, 1),
                    QuizOption.create(12L, "조선", false, 2)
            )
    );

    private final QuizService quizService = new QuizService(new StubQuizReader(quiz));

    @Test
    void 전시물의_퀴즈를_조회한다() {
        QuizResponseDTO response = quizService.getQuizByExhibitId("sample-exhibit");

        assertThat(response.quizId()).isEqualTo(1L);
        assertThat(response.question()).isEqualTo("이 전시물이 제작된 시대는 언제일까요?");
        assertThat(response.options())
                .extracting("id", "content")
                .containsExactly(
                        tuple(11L, "고려"),
                        tuple(12L, "조선")
                );
    }

    @Test
    void 정답을_채점한다() {
        QuizAttemptResponseDTO response = quizService.grade(1L, 11L);

        assertThat(response.correct()).isTrue();
        assertThat(response.explanation()).contains("고려 시대");
    }

    @Test
    void 오답을_채점한다() {
        QuizAttemptResponseDTO response = quizService.grade(1L, 12L);

        assertThat(response.correct()).isFalse();
        assertThat(response.explanation()).contains("고려 시대");
    }

    @Test
    void 다른_퀴즈의_선택지는_제출할_수_없다() {
        assertThatThrownBy(() -> quizService.grade(1L, 999L))
                .isInstanceOf(QuizException.class)
                .hasMessage("해당 퀴즈의 선택지가 아닙니다.");
    }

    @Test
    void 전시물에_퀴즈가_없으면_예외가_발생한다() {
        assertThatThrownBy(() -> quizService.getQuizByExhibitId("unknown"))
                .isInstanceOf(QuizException.class)
                .hasMessage("퀴즈를 찾을 수 없습니다.");
    }

    @Test
    void 퀴즈가_없으면_채점할_수_없다() {
        assertThatThrownBy(() -> quizService.grade(999L, 11L))
                .isInstanceOf(QuizException.class)
                .hasMessage("퀴즈를 찾을 수 없습니다.");
    }

    private record StubQuizReader(Quiz quiz) implements QuizReader {

        @Override
        public Optional<Quiz> findById(Long quizId) {
            return quiz.getId().equals(quizId) ? Optional.of(quiz) : Optional.empty();
        }

        @Override
        public Optional<Quiz> findByExhibitId(String exhibitId) {
            return quiz.getExhibitId().equals(exhibitId) ? Optional.of(quiz) : Optional.empty();
        }
    }
}
