package com.bulog.domain.quiz.dto.res;

import java.util.List;

public record QuizResponseDTO(
        Long quizId,
        String question,
        List<QuizOptionResponseDTO> options
) {
}
