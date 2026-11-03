package com.bulog.domain.exhibit.repository;

import com.bulog.domain.exhibit.entity.Exhibit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

@Repository
@Profile("local")
public class LocalExhibitRepository implements ExhibitCatalog {

    private static final Map<String, Exhibit> EXHIBITS = Map.of(
            "goryeo-celadon",
            Exhibit.create(
                    "goryeo-celadon",
                    null,
                    "청자 상감운학문 매병",
                    "고려",
                    "전시물 API 연동 확인을 위한 로컬 샘플 데이터입니다.",
                    "/images/exhibits/goryeo-celadon.jpg",
                    "부천시립박물관",
                    "e뮤지엄",
                    "https://www.emuseum.go.kr/"
            )
    );

    @Override
    public Optional<Exhibit> findById(String exhibitId) {
        return Optional.ofNullable(EXHIBITS.get(exhibitId));
    }

    @Override
    public List<Exhibit> findAll() {
        return List.copyOf(EXHIBITS.values());
    }
}
