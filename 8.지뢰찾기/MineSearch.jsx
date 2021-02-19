import React, {useReducer, createContext, useMemo, useEffect} from 'react';
import Table from './Table';
import Form from './Form';

export const CODE ={
    MINE: -7,
    NORMAL: -1,
    QUESTION: -2,
    FLAG: -3,
    QUESTION_MINE: -4,
    FLAG_MINE: -5,
    CLICKED_MINE: -6,
    OPENED: 0, //0이상이면 다 OPEND
}
export const TableContext = createContext({
    tableData: [],
    halted: true,
    dispatch: ()=>{},
});

const initialState={
    tableData: [],
    data: {
        row: 0,
        cell: 0,
        mine: 0,
    },
    timer: 0,
    result: '',
    halted: true,
    openedCount: 0,
}
const plantMine = (row, cell, mine)=>{
    console.log(row, cell, mine);
    const candidate = Array(row*cell).fill().map((arr,i)=>{
        return i;
    });
    const shuffle = [];
    while(candidate.length > row * cell - mine){
        const chosen = candidate.splice(Math.floor(Math.random()*candidate.length), 1)[0];
        shuffle.push(chosen);
    }
    const data = [];
    for(let i=0; i < row; i++){
        const rowData = [];
        data.push(rowData);
        for(let j=0; j< cell; j++){
            rowData.push(CODE.NORMAL);
        }
    }
    for(let k =0; k< shuffle.length; k++){
        const ver = Math.floor(shuffle[k]/cell);
        const hor = shuffle[k]%cell;
        data[ver][hor] = CODE.MINE;
    }
    console.log(data)
    return data;
}
export const START_GAME='START_GAME';
export const OPEN_CELL = 'OPEN_CELL';
export const CLICKED_MINE = 'CLICKED_MINE';
export const FLAG_CELL = 'FLAG_CELL';
export const QUESTION_CELL = 'QUESTION_CELL';
export const NORMALIZE_CELL = 'NORMALIZE_CELL';
export const INCREMENT_TIMER = 'INCREMENT_TIMER';

const reducer = (state, action)=>{
    switch(action.type){
        case START_GAME:
            return{
                ...state,
                openedCount: 0,
                data: {
                    row: action.row,
                    cell: action.cell,
                    mine: action.mine,
                },
                tableData: plantMine(action.row, action.cell, action.mine),
                halted: false,
                timer: 0,
            };
        case OPEN_CELL:
            const tableData=[...state.tableData];
            tableData.forEach((row, i)=>{
                tableData[i] = [...state.tableData[i]];
            });
            const checked = [];
            let openedcount = 0;
            const checkArround = (row, cell) =>{
                if([CODE.OPENED, CODE.FLAG_MINE, CODE.FLAG, CODE.QUESTION_MINE, CODE.QUESTION].includes(tableData[row][cell])){
                    return;
                }
                if(tableData[row][cell]>0){
                    return;
                }
                if(row < 0 || row >= tableData.length || cell < 0 || cell >= tableData[0].length){ //상하좌우가 비어있을경우
                    return;
                }
                if(checked.includes(row+ ',' + cell)){
                    return;
                }
                else{
                    checked.push(row + ',' + cell);
                }
                openedcount +=1;
                let around = [];
                if(tableData[row-1]){
                    around = around.concat(
                        tableData[row-1][cell-1],
                        tableData[row-1][cell],
                        tableData[row-1][cell+1]
                    );
                }
                around = around.concat(
                    tableData[row][cell-1],
                    tableData[row][cell+1],
                );
                if(tableData[row+1]){
                    around = around.concat(
                        tableData[row+1][cell-1],
                        tableData[row+1][cell],
                        tableData[row+1][cell+1]
                    );
                }
                //filter : filter내의 callback이 참인 요소를 배열에 넣는다.
                //includes : array.includes(v) 에서 v가 array안에 있으면 true return
                const count = around.filter((v)=>[CODE.MINE, CODE.FLAG_MINE, CODE.QUESTION_MINE].includes(v)).length;
                tableData[row][cell]=count;
                if(count === 0){
                    const near = [];
                    if(row-1 > -1) {
                        near.push([row -1, cell - 1]);
                        near.push([row -1, cell]);
                        near.push([row -1, cell + 1]);
                    }
                    near.push([row, cell - 1]);
                    near.push([row, cell + 1]);
                    if(row+1 < tableData.length) {
                        near.push([row +1, cell - 1]);
                        near.push([row +1, cell]);
                        near.push([row +1, cell + 1]);
                    }
                    near.forEach((n)=>{
                        if(tableData[n[0]][n[1]] !== CODE.OPENED){
                        checkArround(n[0], n[1]);
                        }
                    });
                }
                tableData[row][cell] = count;
            };
            checkArround(action.row, action.cell);
            let halted = false;
            let result = '';
            if(state.data.row*state.data.cell-state.data.mine===state.openedCount+openedcount){
                halted=true;
                result = state.timer+'초만에승리하셨습니다.';
            }
            return{
                ...state,
                tableData,
                openedCount: state.openedCount+openedcount,
                halted,
                result,
            };
        case CLICKED_MINE:{
            const tableData=[...state.tableData];
            tableData[action.row]=[...state.tableData[action.row]];
            tableData[action.row][action.cell] = CODE.CLICKED_MINE;
            return{
                ...state,
                tableData,
                halted: true,
            };
        }
        case FLAG_CELL:{
            const tableData=[...state.tableData];
            tableData[action.row]=[...state.tableData[action.row]];
            if(tableData[action.row][action.cell]===CODE.MINE){
                tableData[action.row][action.cell]=CODE.FLAG_MINE;
            }
            else{
                tableData[action.row][action.cell]=CODE.FLAG;
            }
            return{
                ...state,
                tableData,
            };
        }
        case QUESTION_CELL:{
            const tableData=[...state.tableData];
            tableData[action.row]=[...state.tableData[action.row]];
            if(tableData[action.row][action.cell]===CODE.FLAG_MINE){
                tableData[action.row][action.cell]=CODE.QUESTION_MINE;
            }
            else{
                tableData[action.row][action.cell]=CODE.QUESTION;
            }
            return{
                ...state,
                tableData,
            };
        }
        case NORMALIZE_CELL:{
            const tableData=[...state.tableData];
            tableData[action.row]=[...state.tableData[action.row]];
            if(tableData[action.row][action.cell]===CODE.QUESTION_MINE){
                tableData[action.row][action.cell]=CODE.MINE;
            }
            else{
                tableData[action.row][action.cell]=CODE.NORMAL;
            }
            return{
                ...state,
                tableData,
            };
        }
        case INCREMENT_TIMER:{
            return{
                ...state,
                timer: state.timer+1,
            }
        }
        default:
            return state;
    }
}

const MineSearch = () =>{
    const [state, dispatch] = useReducer(reducer, initialState);
    const {tableData, halted, timer, result} = state;
    const value = useMemo(()=>({ tableData: tableData, halted: halted, dispatch }),[tableData, halted])

    useEffect(()=>{
        let timer;
        if(halted === false){
            timer = setInterval(()=>{
                dispatch({type: INCREMENT_TIMER});
            }, 1000)
        }
        return ()=>{
            clearInterval(timer)
        }
    }, [halted]);
    return (
        //<TableContext.Provider value={{tableData: state.tableData, dispatch}}>  이런식으로 하면
        // value에 새로 할당된 객체가 들어가고 provider 안에있는 componenet들이 모두 리렌더링된다.?
        <TableContext.Provider value={value}> 
        <Form/>
        <div>{state.timer}</div>
        <Table/>
        <div>{state.result}</div>
        </TableContext.Provider>
    )
};
export default MineSearch;