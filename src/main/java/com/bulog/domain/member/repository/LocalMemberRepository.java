package com.bulog.domain.member.repository;

import com.bulog.domain.member.entity.Member;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

@Repository
@Profile("local")
public class LocalMemberRepository implements MemberStore {

    private final AtomicLong sequence = new AtomicLong();
    private final Map<Long, Member> membersById = new ConcurrentHashMap<>();
    private final Map<String, Member> membersByEmail = new ConcurrentHashMap<>();
    // MySQL 기본 정렬(utf8mb4_unicode_ci)처럼 영문 대소문자를 구분하지 않는다.
    private final Map<String, Member> membersByNickname = new ConcurrentHashMap<>();

    @Override
    public Member store(Member member) {
        Member storedMember = member.getId() == null
                ? member.withId(sequence.incrementAndGet())
                : member;
        membersByEmail.put(storedMember.getEmail(), storedMember);
        membersByNickname.put(nicknameKey(storedMember.getNickname()), storedMember);
        membersById.put(storedMember.getId(), storedMember);
        return storedMember;
    }

    @Override
    public Optional<Member> findById(Long memberId) {
        return Optional.ofNullable(membersById.get(memberId));
    }

    @Override
    public Optional<Member> findByEmail(String email) {
        return Optional.ofNullable(membersByEmail.get(Member.normalizeEmail(email)));
    }

    @Override
    public boolean existsByEmail(String email) {
        return membersByEmail.containsKey(Member.normalizeEmail(email));
    }

    @Override
    public boolean existsByNickname(String nickname) {
        return membersByNickname.containsKey(nicknameKey(nickname));
    }

    private static String nicknameKey(String nickname) {
        return Member.normalizeNickname(nickname).toLowerCase(Locale.ROOT);
    }
}
