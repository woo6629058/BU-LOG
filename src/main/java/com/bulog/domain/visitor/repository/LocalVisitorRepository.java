package com.bulog.domain.visitor.repository;

import com.bulog.domain.visitor.entity.Visitor;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

@Repository
@Profile("local")
public class LocalVisitorRepository implements VisitorStore {

    private final AtomicLong sequence = new AtomicLong();
    private final Map<String, Visitor> visitorsByTokenHash = new ConcurrentHashMap<>();

    @Override
    public Visitor store(Visitor visitor) {
        Visitor storedVisitor = visitor;
        if (visitor.getId() == null) {
            storedVisitor = Visitor.create(sequence.incrementAndGet(), visitor.getTokenHash());
            if (visitor.getMember() != null) {
                storedVisitor.linkMember(visitor.getMember());
            }
        }
        visitorsByTokenHash.put(storedVisitor.getTokenHash(), storedVisitor);
        return storedVisitor;
    }

    @Override
    public Optional<Visitor> findByTokenHash(String tokenHash) {
        return Optional.ofNullable(visitorsByTokenHash.get(tokenHash));
    }

    @Override
    public Optional<Visitor> findByIdForUpdate(Long visitorId) {
        return visitorsByTokenHash.values().stream()
                .filter(visitor -> visitor.getId().equals(visitorId))
                .findFirst();
    }

    @Override
    public List<Visitor> findAllByMember_Id(Long memberId) {
        return visitorsByTokenHash.values().stream()
                .filter(visitor -> visitor.isLinkedTo(memberId))
                .toList();
    }
}
