package com.bulog.domain.exhibit.repository;

import com.bulog.domain.exhibit.entity.Exhibit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
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
    public List<Exhibit> findAllCollectible() {
        return allExhibits().stream()
                .filter(Exhibit::isCollectible)
                .toList();
    }

    @Override
    public Page<Exhibit> search(
            String keyword,
            String exhibitionRoom,
            Boolean collectible,
            Pageable pageable
    ) {
        List<Exhibit> filtered = allExhibits().stream()
                .filter(exhibit -> keyword == null
                        || exhibit.getName().toLowerCase().contains(keyword.toLowerCase()))
                .filter(exhibit -> exhibitionRoom == null
                        || exhibitionRoom.equals(exhibit.getExhibitionRoom()))
                .filter(exhibit -> collectible == null
                        || collectible == exhibit.isCollectible())
                .toList();
        int start = Math.min((int) pageable.getOffset(), filtered.size());
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        return new PageImpl<>(filtered.subList(start, end), pageable, filtered.size());
    }

    private List<Exhibit> allExhibits() {
        return List.copyOf(EXHIBITS.values());
    }
}
