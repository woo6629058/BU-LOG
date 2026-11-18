package com.bulog.domain.quiz.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class QuizUpdateTest {

    private Quiz quiz() {
        return Quiz.create(1L, "ongi2-janggun", "질문", "해설", "힌트", null, List.of(
                QuizOption.create(11L, "옆면", true, 1),
                QuizOption.create(12L, "윗면", false, 2)
        ));
    }

    @Test
    void 보기가_같으면_보기_ID를_그대로_두고_글만_바꾼다() {
        Quiz quiz = quiz();

        boolean rebuilt = quiz.update("새 질문", "새 해설", null, List.of("가", "나"), List.of(
                QuizOption.create(null, "옆면", true, 1),
                QuizOption.create(null, "윗면", false, 2)
        ));

        assertThat(rebuilt).isFalse();
        assertThat(quiz.getQuestion()).isEqualTo("새 질문");
        assertThat(quiz.getHint()).isNull();
        assertThat(quiz.getDialLabelList()).containsExactly("가", "나");
        assertThat(quiz.getOptions()).extracting(QuizOption::getId).containsExactly(11L, 12L);
    }

    @Test
    void 보기가_바뀌면_새로_만든다() {
        Quiz quiz = quiz();

        boolean rebuilt = quiz.update("질문", "해설", "힌트", null, List.of(
                QuizOption.create(null, "윗면", true, 1),
                QuizOption.create(null, "옆면", false, 2)
        ));

        assertThat(rebuilt).isTrue();
        assertThat(quiz.isCorrectOption(11L)).isFalse();
        assertThat(quiz.getOptions()).extracting(QuizOption::getContent).containsExactly("윗면", "옆면");
    }
}
