// managers/SkillAreaPool.js

class SkillAreaPool {
    constructor(poolSize = 100) {
        this.pool = [];
        this.poolSize = poolSize;
        this.skillAreaCounter = 0;

        // 초기화 시 skillArea 객체들을 미리 생성해 풀에 저장
        for (let i = 0; i < poolSize; i++) {
            this.pool.push(this.createSkillArea());
        }
    }

    /**
     * skillArea의 템플릿 객체를 생성
     * - 풀에 넣기 위해 사용
     * - getSkillArea()로 꺼낼 때 이 형식을 기반으로 제공됨
     */
    createSkillArea() {
        return {
            skillAreaId: this.skillAreaCounter++,
            type: 'circle',
            center: { x: 0, y: 0, z: 0 },
            width: 0,
            height: 0,
            caster: '',
            createdAt: 0,
            duration: 0,
            active: false
        };
    }

    /**
     * 사용 가능한 skillArea 하나를 풀에서 꺼냄
     * - AoE 스킬 사용 시 호출됨
     * - active 플래그를 true로 바꾸어 재사용됨
     */
    getSkillArea() {
        for (let i = 0; i < this.pool.length; i++) {
            if (!this.pool[i].active) {
                this.pool[i].active = true;
                return this.pool[i];
            }
        }
        return null; // 사용 가능한 객체가 없을 경우
    }

    /**
     * 스킬 효과가 끝난 후 skillArea를 초기화하고 풀에 반환
     * - IntervalManager의 addTimeout 등에서 일정 시간 후 자동 반환에 사용
     */
    returnSkillArea(skillArea) {
        skillArea.type = 'circle';                 //circle이면 원 rectangle이면 사각형
        skillArea.center = { x: 0, y: 0, z: 0 };   // 중심 좌표
        skillArea.width = 0;                       //가로
        skillArea.height = 0;                      //세로
        skillArea.caster = '';                     //시전자 이름
        skillArea.createdAt = 0;                   //시전시작시간
        skillArea.duration = 0;                    //지속시간(만약 지속형이면 이떄까지 지속 즉발이면 이시간후 데미지 판정)
        skillArea.active = false;                  //지금 활성화 상태
    }

    /**
     * 현재 활성 상태인 skillArea 목록을 반환
     * - 충돌 체크나 AoE 시각화용
     */
    getActiveSkillAreas() {
        return this.pool.filter(skillArea => skillArea.active);
    }

    /**
     * skillAreaId로 특정 객체를 찾아 반환
     * - 충돌 판정 시 사용
     */
    getSkillAreaById(skillAreaId) {
        return this.pool.find(skillArea => skillArea.skillAreaId === skillAreaId && skillArea.active);
    }
}

export default SkillAreaPool;
