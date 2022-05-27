import {CHANGE_SEARCH_FIELD, SEARCH_SKILLS_REQUEST, SEARCH_USER_CANCELLED} from "../actions/action-types";
import {debounce, put, spawn, takeLatest, retry, take, cancel} from 'redux-saga/effects';
import {searchSkillsFailure, searchSkillsRequest, searchSkillsSuccess} from "../actions";
import {searchSkills} from "../api";

function filterChangeSearchAction({type, payload}) {
    return type === CHANGE_SEARCH_FIELD && payload.search.trim() !== '';
}

function* watchChangeSearchSaga() {
    yield debounce(500, filterChangeSearchAction, debouncedChangeSearchSaga);
}

function* debouncedChangeSearchSaga(action) {
    yield put(searchSkillsRequest(action.payload));
}

function* watchSearchSkillsSaga() {
    while (true) {
        const lastTask = yield takeLatest(SEARCH_SKILLS_REQUEST, handleSearchSkillsSaga);
        yield take(SEARCH_USER_CANCELLED);
        yield cancel(lastTask);
    }
}

function* handleSearchSkillsSaga(action) {
    try {
        const retryCount = 3;
        const retryDelay = 1000;
        const data = yield retry(
            retryCount, retryDelay, searchSkills, action.payload.search
        );
        yield put(searchSkillsSuccess(data));
    } catch (e) {
        yield put(searchSkillsFailure(e.message));
    }
}

/**/
export default function* saga() {
    yield spawn(watchChangeSearchSaga);
    yield spawn(watchSearchSkillsSaga);
}
