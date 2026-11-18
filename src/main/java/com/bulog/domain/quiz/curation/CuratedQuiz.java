package com.bulog.domain.quiz.curation;

import com.bulog.domain.quiz.entity.Quiz;
import com.bulog.domain.quiz.entity.QuizOption;
import java.util.List;
import java.util.stream.IntStream;

/**
 * 유물 하나의 관찰 미션.
 *
 * @param exhibitId  유물 ID (CuratedExhibits와 같은 값)
 * @param hint       힌트 문구. 없으면 null
 * @param dialLabels 자물쇠 게임의 다이얼 이름. 자물쇠가 아니면 null
 * @param options    보기. 화면에 보이는 순서는 화면이 섞는다.
 */
public record CuratedQuiz(
        String exhibitId,
        String question,
        String explanation,
        String hint,
        List<String> dialLabels,
        List<Option> options
) {

    /**
     * @param localId local 프로필에서 쓰는 보기 ID. 운영 DB에서는 DB가 ID를 만든다.
     */
    public record Option(long localId, String content, boolean correct) {
    }

    public static Option option(long localId, String content) {
        return new Option(localId, content, false);
    }

    public static Option answer(long localId, String content) {
        return new Option(localId, content, true);
    }

    /** 운영 DB용: 보기 ID는 비워 두고 DB가 만들게 한다. */
    public List<QuizOption> toOptions() {
        return IntStream.range(0, options.size())
                .mapToObj(index -> QuizOption.create(
                        null,
                        options.get(index).content(),
                        options.get(index).correct(),
                        index + 1
                ))
                .toList();
    }

    public Quiz toNewQuiz() {
        return Quiz.create(null, exhibitId, question, explanation, hint, dialLabels, toOptions());
    }

    /** local 프로필용: 메모리 저장소라 ID를 직접 정한다. */
    public Quiz toLocalQuiz(long quizId) {
        List<QuizOption> localOptions = IntStream.range(0, options.size())
                .mapToObj(index -> QuizOption.create(
                        options.get(index).localId(),
                        options.get(index).content(),
                        options.get(index).correct(),
                        index + 1
                ))
                .toList();
        return Quiz.create(quizId, exhibitId, question, explanation, hint, dialLabels, localOptions);
    }

    public void applyTo(Quiz quiz) {
        quiz.update(question, explanation, hint, dialLabels, toOptions());
    }
}
