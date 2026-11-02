package com.bulog.domain.visitor.repository;

import com.bulog.domain.visitor.entity.Visitor;
import java.util.List;
import java.util.Optional;

public interface VisitorStore {

    Visitor store(Visitor visitor);

    Optional<Visitor> findByIdForUpdate(Long visitorId);

    Optional<Visitor> findByTokenHash(String tokenHash);

    List<Visitor> findAllByMember_Id(Long memberId);
}
