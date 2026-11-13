package com.bulog.domain.exhibit.repository;

import com.bulog.domain.exhibit.curation.CuratedExhibit;
import com.bulog.domain.exhibit.curation.CuratedExhibits;
import com.bulog.domain.exhibit.entity.Exhibit;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

/**
 * DB 없이 켜는 local 프로필용 전시물 저장소.
 * 운영 서버와 같은 수집 대상 유물 24개(CuratedExhibits)를 메모리에 둔다.
 */
@Repository
@Profile("local")
public class LocalExhibitRepository implements ExhibitCatalog {

    private final Map<String, Exhibit> exhibits = CuratedExhibits.ALL.stream()
            .map(CuratedExhibit::toNewExhibit)
            .collect(Collectors.toMap(
                    Exhibit::getId,
                    Function.identity(),
                    (first, second) -> first,
                    LinkedHashMap::new
            ));

    @Override
    public Optional<Exhibit> findById(String exhibitId) {
        return Optional.ofNullable(exhibits.get(exhibitId));
    }

    @Override
    public List<Exhibit> findAllCollectible() {
        return exhibits.values().stream()
                .filter(Exhibit::isCollectible)
                .sorted(Comparator.comparing(Exhibit::getCardNumber))
                .toList();
    }

    @Override
    public Page<Exhibit> search(
            String keyword,
            String exhibitionRoom,
            Boolean collectible,
            Pageable pageable
    ) {
        List<Exhibit> filtered = exhibits.values().stream()
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
}
