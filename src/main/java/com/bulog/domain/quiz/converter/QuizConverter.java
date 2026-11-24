package com.bulog.domain.quiz.converter;

import com.bulog.domain.collection.dto.res.CollectionAcquisitionResponseDTO;
import com.bulog.domain.quiz.dto.res.QuizAttemptResponseDTO;
import com.bulog.domain.quiz.dto.res.QuizOptionResponseDTO;
import com.bulog.domain.quiz.dto.res.QuizResponseDTO;
import com.bulog.domain.quiz.entity.Quiz;

public final class QuizConverter {

    private QuizConverter() {
    }

    public static QuizResponseDTO toResponse(Quiz quiz) {
        var options = quiz.getOptions().stream()
                .map(option -> new QuizOptionResponseDTO(option.getId(), option.getContent()))
                .toList();

        return new QuizResponseDTO(
                quiz.getId(),
                quiz.getQuestion(),
                quiz.getHint(),
                quiz.getDialLabelList(),
                options
        );
    }

    public static QuizAttemptResponseDTO toAttemptResponse(
            Quiz quiz,
            boolean correct,
            CollectionAcquisitionResponseDTO collection
    ) {
        // 해설에는 정답이 들어 있어서 맞혔을 때만 보낸다.
        return new QuizAttemptResponseDTO(correct, correct ? quiz.getExplanation() : null, collection);
    }
}
