package com.bulog.domain.quiz.curation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bulog.domain.quiz.entity.Quiz;
import com.bulog.domain.quiz.repository.QuizRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class CuratedQuizServiceTest {

    private final QuizRepository quizRepository = mock(QuizRepository.class);
    private final CuratedQuizService service = new CuratedQuizService(quizRepository);

    @Test
    void 없는_미션은_새로_만들고_있는_미션은_갱신한다() {
        CuratedQuiz first = CuratedQuizzes.ALL.get(0);
        CuratedQuiz second = CuratedQuizzes.ALL.get(1);
        Quiz existing = second.toLocalQuiz(2L);
        when(quizRepository.findByExhibitId(anyString())).thenReturn(Optional.empty());
        when(quizRepository.findByExhibitId(second.exhibitId())).thenReturn(Optional.of(existing));

        CuratedQuizResult result = service.apply(List.of(first, second));

        assertThat(result).isEqualTo(new CuratedQuizResult(2, 1, 1));
        verify(quizRepository, times(2)).save(any(Quiz.class));
        assertThat(existing.getOptions().getFirst().getId()).isEqualTo(second.options().getFirst().localId());
    }
}
