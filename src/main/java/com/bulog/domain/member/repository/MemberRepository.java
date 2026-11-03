package com.bulog.domain.member.repository;

import com.bulog.domain.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long>, MemberStore {

    @Override
    default Member store(Member member) {
        return save(member);
    }
}
