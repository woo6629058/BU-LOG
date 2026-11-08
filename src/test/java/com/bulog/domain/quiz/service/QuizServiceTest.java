package com.bulog.domain.quiz.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.groups.Tuple.tuple;

import com.bulog.domain.card.repository.LocalCardCollectionRepository;
import com.bulog.domain.card.service.CardService;
import com.bulog.domain.exhibit.entity.Exhibit;
import com.bulog.domain.exhibit.repository.ExhibitCatalog;
import com.bulog.domain.quiz.dto.res.QuizAttemptResponseDTO;
import com.bulog.domain.quiz.dto.res.QuizResponseDTO;
import com.bulog.domain.quiz.entity.Quiz;
import com.bulog.domain.quiz.entity.QuizOption;
import com.bulog.domain.quiz.exception.QuizException;
import com.bulog.domain.quiz.repository.QuizReader;
import com.bulog.domain.visitor.entity.Visitor;
import com.bulog.domain.visitor.repository.VisitorStore;
import com.bulog.domain.visitor.service.VisitorService;
import com.bulog.domain.visitor.service.VisitorTokenService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

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

    private final Visitor visitor = Visitor.create(1L, "sample-token-hash");
    private final QuizService quizService = new QuizService(
            new StubQuizReader(quiz),
            new CardService(
                    new LocalCardCollectionRepository(),
                    new StubExhibitCatalog(),
                    new VisitorService(new StubVisitorStore(visitor), new VisitorTokenService())
            )
    );

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
        QuizAttemptResponseDTO response = quizService.grade(1L, 11L, visitor, null);

        assertThat(response.correct()).isTrue();
        assertThat(response.explanation()).contains("고려 시대");
        assertThat(response.card()).isNotNull();
        assertThat(response.card().newlyAcquired()).isTrue();
    }

    @Test
    void 오답을_채점한다() {
        QuizAttemptResponseDTO response = quizService.grade(1L, 12L, visitor, null);

        assertThat(response.correct()).isFalse();
        assertThat(response.explanation()).contains("고려 시대");
        assertThat(response.card()).isNull();
    }

    @Test
    void 다른_퀴즈의_선택지는_제출할_수_없다() {
        assertThatThrownBy(() -> quizService.grade(1L, 999L, visitor, null))
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
        assertThatThrownBy(() -> quizService.grade(999L, 11L, visitor, null))
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

    private static class StubVisitorStore implements VisitorStore {

        private final Visitor visitor;

        private StubVisitorStore(Visitor visitor) {
            this.visitor = visitor;
        }

        @Override
        public Visitor store(Visitor visitor) {
            return visitor;
        }

        @Override
        public Optional<Visitor> findByIdForUpdate(Long visitorId) {
            return visitor.getId().equals(visitorId) ? Optional.of(visitor) : Optional.empty();
        }

        @Override
        public Optional<Visitor> findByTokenHash(String tokenHash) {
            return Optional.of(visitor);
        }

        @Override
        public List<Visitor> findAllByMember_Id(Long memberId) {
            return List.of(visitor);
        }
    }

    private static class StubExhibitCatalog implements ExhibitCatalog {

        private final Exhibit exhibit = Exhibit.create(
                "sample-exhibit",
                null,
                "샘플 전시물",
                "고려",
                "샘플 설명",
                "/images/sample.jpg",
                "부천시립박물관",
                "e뮤지엄",
                "https://www.emuseum.go.kr/"
        );

        @Override
        public Optional<Exhibit> findById(String exhibitId) {
            return exhibit.getId().equals(exhibitId) ? Optional.of(exhibit) : Optional.empty();
        }

        @Override
        public List<Exhibit> findAllCollectible() {
            return List.of(exhibit);
        }

        @Override
        public Page<Exhibit> search(
                String keyword,
                String exhibitionRoom,
                Boolean collectible,
                Pageable pageable
        ) {
            return new PageImpl<>(List.of(exhibit), pageable, 1);
        }
    }
}
