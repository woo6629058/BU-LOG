package com.bulog.domain.card.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.bulog.domain.card.entity.CardCollection;
import com.bulog.domain.visitor.entity.Visitor;
import com.bulog.domain.visitor.repository.LocalVisitorRepository;
import java.util.List;
import org.junit.jupiter.api.Test;

class LocalCardCollectionRepositoryTest {

    private final LocalVisitorRepository visitorStore = new LocalVisitorRepository();

    @Test
    void 방문자를_처음_볼_때_샘플_카드를_한_번만_넣는다() {
        Visitor visitor = visitorStore.store(Visitor.create(null, "sample-token-hash"));
        LocalCardCollectionRepository repository = new LocalCardCollectionRepository(visitorStore);

        List<CardCollection> first = repository.findAllByVisitor_IdIn(List.of(visitor.getId()));
        List<CardCollection> second = repository.findAllByVisitor_IdIn(List.of(visitor.getId()));

        assertThat(first)
                .extracting(CardCollection::getExhibitId)
                .containsExactlyInAnyOrderElementsOf(LocalCardCollectionRepository.SAMPLE_EXHIBIT_IDS);
        assertThat(second).hasSameSizeAs(first);
    }

    @Test
    void 방문자_저장소가_없으면_샘플_카드를_넣지_않는다() {
        Visitor visitor = visitorStore.store(Visitor.create(null, "sample-token-hash"));
        LocalCardCollectionRepository repository = new LocalCardCollectionRepository();

        assertThat(repository.findAllByVisitor_IdIn(List.of(visitor.getId()))).isEmpty();
    }
}
