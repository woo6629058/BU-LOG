package com.bulog.domain.member.repository;

import com.bulog.domain.member.entity.Member;
import java.util.Optional;

public interface MemberStore {

    Member store(Member member);

    Optional<Member> findById(Long memberId);

    Optional<Member> findByEmail(String email);

    boolean existsByEmail(String email);
}
