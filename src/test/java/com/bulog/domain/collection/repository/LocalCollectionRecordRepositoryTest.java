package com.bulog.domain.collection.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.bulog.domain.collection.entity.CollectionRecord;
import com.bulog.domain.visitor.entity.Visitor;
import com.bulog.domain.visitor.repository.LocalVisitorRepository;
import java.util.List;
import org.junit.jupiter.api.Test;

class LocalCollectionRecordRepositoryTest {

    private final LocalVisitorRepository visitorStore = new LocalVisitorRepository();

    @Test
    void 방문자를_처음_볼_때_샘플_기록을_한_번만_넣는다() {
        Visitor visitor = visitorStore.store(Visitor.create(null, "sample-token-hash"));
        LocalCollectionRecordRepository repository = new LocalCollectionRecordRepository(visitorStore);

        List<CollectionRecord> first = repository.findAllByVisitor_IdIn(List.of(visitor.getId()));
        List<CollectionRecord> second = repository.findAllByVisitor_IdIn(List.of(visitor.getId()));

        assertThat(first)
                .extracting(CollectionRecord::getExhibitId)
                .containsExactlyInAnyOrderElementsOf(LocalCollectionRecordRepository.SAMPLE_EXHIBIT_IDS);
        assertThat(second).hasSameSizeAs(first);
    }

    @Test
    void 방문자_저장소가_없으면_샘플_기록을_넣지_않는다() {
        Visitor visitor = visitorStore.store(Visitor.create(null, "sample-token-hash"));
        LocalCollectionRecordRepository repository = new LocalCollectionRecordRepository();

        assertThat(repository.findAllByVisitor_IdIn(List.of(visitor.getId()))).isEmpty();
    }
}
